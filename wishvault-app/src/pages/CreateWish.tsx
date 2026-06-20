import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Image, Sprout, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { MotionConfirmDialog } from "@/components/MotionConfirmDialog";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { WishImage } from "@/components/WishImage";
import { describeWalletError, getSignerContracts } from "@/lib/contracts";
import { parseUsdc } from "@/lib/format";
import { buildImageURIWithFocus, getImageFocus, MAX_PINATA_IMAGE_BYTES, stripImageFocusParams, uploadImageToPinata } from "@/lib/ipfs";
import { useWallet } from "@/lib/wallet-context";

type CreateWishForm = {
  title: string;
  description: string;
  imageURI: string;
  imageFocusX: string;
  imageFocusY: string;
  goal: string;
  recipient: string;
};

type CreateWishProps = {
  onConfirmed: () => Promise<void>;
};

export function CreateWish({ onConfirmed }: CreateWishProps) {
  const wallet = useWallet();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localImagePreview, setLocalImagePreview] = useState<string>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<CreateWishForm>({
    defaultValues: { title: "", description: "", imageURI: "", imageFocusX: "50", imageFocusY: "50", goal: "", recipient: "" }
  });
  const draft = watch();
  const imageFocus = {
    x: normalizeFocus(draft.imageFocusX),
    y: normalizeFocus(draft.imageFocusY)
  };
  const focusedImageURI = buildImageURIWithFocus(draft.imageURI, imageFocus);
  const imageURIField = register("imageURI", {
    onChange: (event) => {
      setLocalImagePreview(undefined);
      syncFocusFromImageURI(event.currentTarget.value);
    }
  });

  useEffect(() => {
    return () => {
      if (localImagePreview) URL.revokeObjectURL(localImagePreview);
    };
  }, [localImagePreview]);

  async function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLocalImagePreview(URL.createObjectURL(file));
    setIsUploading(true);
    setUploadProgress(0);
    setStatus("Uploading this specimen image to IPFS.");
    try {
      const result = await uploadImageToPinata(file, setUploadProgress);
      setValue("imageURI", result.imageURI, { shouldDirty: true, shouldTouch: true });
      setValue("imageFocusX", "50", { shouldDirty: true, shouldTouch: true });
      setValue("imageFocusY", "50", { shouldDirty: true, shouldTouch: true });
      setStatus(`Image pinned to IPFS: ${result.cid}`);
    } catch (error) {
      setLocalImagePreview(undefined);
      setStatus(error instanceof Error ? error.message : "That image could not be attached.");
    } finally {
      setIsUploading(false);
    }
  }

  function clearImage() {
    setLocalImagePreview(undefined);
    setValue("imageURI", "", { shouldDirty: true, shouldTouch: true });
    setValue("imageFocusX", "50", { shouldDirty: true, shouldTouch: true });
    setValue("imageFocusY", "50", { shouldDirty: true, shouldTouch: true });
  }

  function updateImageFocus(axis: "x" | "y", value: string) {
    setValue(axis === "x" ? "imageFocusX" : "imageFocusY", String(normalizeFocus(value)), { shouldDirty: true, shouldTouch: true });
  }

  function syncFocusFromImageURI(imageURI: string) {
    if (!/[?&]focus[XY]=/i.test(imageURI)) return;
    const nextFocus = getImageFocus(imageURI);
    setValue("imageFocusX", String(nextFocus.x), { shouldDirty: true, shouldTouch: true });
    setValue("imageFocusY", String(nextFocus.y), { shouldDirty: true, shouldTouch: true });
  }

  function setFocusFromPreview(event: MouseEvent<HTMLButtonElement>) {
    if (!draft.imageURI && !localImagePreview) {
      imageInputRef.current?.click();
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    updateImageFocus("x", String(((event.clientX - bounds.left) / bounds.width) * 100));
    updateImageFocus("y", String(((event.clientY - bounds.top) / bounds.height) * 100));
  }

  async function onSubmit(values: CreateWishForm) {
    setReviewOpen(false);
    const connectedAddress = wallet.address ?? (await wallet.connect());
    if (!connectedAddress) {
      return;
    }
    if (!values.recipient.trim()) setValue("recipient", connectedAddress);

    setIsBusy(true);
    setStatus(undefined);
    try {
      const signer = await wallet.signer();
      const { registry } = await getSignerContracts(signer);
      const recipient = values.recipient.trim() || connectedAddress;
      const goal = values.goal.trim() ? parseUsdc(values.goal) : 0n;
      const imageURI = buildImageURIWithFocus(stripImageFocusParams(values.imageURI), {
        x: normalizeFocus(values.imageFocusX),
        y: normalizeFocus(values.imageFocusY)
      });
      setStatus("Registering this specimen on Arc.");
      const tx = await registry.createWish(values.title, values.description, imageURI, goal, recipient);
      await tx.wait();
      setStatus("Specimen registered.");
      await onConfirmed();
      navigate("/");
    } catch (error) {
      setStatus(describeWalletError(error, "That specimen could not be registered. Check the fields and try again."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="grid gap-6 py-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <p className="font-mono text-sm text-vine">new specimen</p>
          <h2 className="font-display text-4xl font-medium leading-tight text-moss">Register a new specimen</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-moss/70">
            Create a wish, set a USDC goal if you have one, and choose who can collect the funds.
          </p>
        </div>
        <div className="rounded-lg border border-clay/25 bg-paper p-4 shadow-plate">
          <p className="font-display text-xl font-medium text-moss">Draft growth</p>
          <p className="mt-1 font-mono text-sm text-vine mono-tabular">64% preview plate</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-moss/10 bg-glasshouse">
            <CardTitle>Specimen plate</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              <Field id="title" label="Title">
                <Input id="title" required placeholder="A field camera" {...register("title", { required: true })} />
              </Field>
              <Field id="description" label="Description">
                <Textarea id="description" required placeholder="Tell people what this wish helps make possible." {...register("description", { required: true })} />
              </Field>
              <div className="grid gap-2">
                <Label htmlFor="imageURI">Image</Label>
                <input ref={imageInputRef} id="imageUpload" type="file" accept="image/*" className="sr-only" onChange={onImageFileChange} disabled={isUploading} />
                <button
                  type="button"
                  className="group grid min-h-28 cursor-pointer place-items-center rounded-lg border border-dashed border-vine/35 bg-glasshouse px-4 py-5 text-center transition-colors hover:border-vine hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-vine/25 bg-paper text-vine transition-colors group-hover:border-vine">
                    <Upload className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-3 font-display text-lg font-medium text-moss">{isUploading ? "Uploading to IPFS" : "Upload a specimen image"}</span>
                  <span className="mt-1 max-w-md text-sm leading-6 text-moss/65">
                    Files are pinned through Pinata and stored as ipfs:// CIDs. Max {Math.round(MAX_PINATA_IMAGE_BYTES / 1024 / 1024)} MB. Paste a URL below if the image already lives elsewhere.
                  </span>
                  {isUploading ? (
                    <span className="mt-4 h-2 w-full max-w-sm overflow-hidden rounded-full bg-paper">
                      <span className="block h-full bg-vine transition-[width]" style={{ width: `${Math.max(uploadProgress, 8)}%` }} />
                    </span>
                  ) : null}
                </button>
                <div className="flex gap-2">
                  <input type="hidden" {...register("imageFocusX")} />
                  <input type="hidden" {...register("imageFocusY")} />
                  <Input id="imageURI" type="text" inputMode="url" placeholder="https://... or ipfs://..." {...imageURIField} />
                  {draft.imageURI ? (
                    <Button type="button" variant="quiet" size="sm" aria-label="Clear selected image" onClick={clearImage}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                {draft.imageURI ? (
                  <div className="grid gap-3 rounded-md border border-vine/20 bg-glasshouse p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="imageFocusX">Horizontal crop</Label>
                        <Slider id="imageFocusX" min={0} max={100} step={1} value={imageFocus.x} onChange={(event) => updateImageFocus("x", event.currentTarget.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imageFocusY">Vertical crop</Label>
                        <Slider id="imageFocusY" min={0} max={100} step={1} value={imageFocus.y} onChange={(event) => updateImageFocus("y", event.currentTarget.value)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 font-mono text-xs text-moss/65 mono-tabular">
                      <span>{imageFocus.x}% / {imageFocus.y}%</span>
                      <Button type="button" variant="quiet" size="sm" onClick={() => {
                        updateImageFocus("x", "50");
                        updateImageFocus("y", "50");
                      }}>
                        Center
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="goal" label="Goal">
                  <Input id="goal" inputMode="decimal" placeholder="0 for no target" {...register("goal")} />
                </Field>
                <Field id="recipient" label="Recipient">
                  <Input
                    id="recipient"
                    placeholder={wallet.address || "Connect wallet to fill yours"}
                    {...register("recipient")}
                    onFocus={() => {
                      if (wallet.address) setValue("recipient", wallet.address);
                    }}
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="vine" disabled={isBusy || isUploading || wallet.isConnecting} onClick={() => setReviewOpen(true)}>
                  <Sprout className="h-4 w-4" aria-hidden="true" />
                  Review specimen plate
                </Button>
                <Button type="submit" variant="quiet" disabled={isBusy || isUploading || wallet.isConnecting}>
                  {wallet.address ? (isBusy ? "Registering" : "Plant without review") : wallet.isConnecting ? "Opening wallet" : "Connect wallet"}
                </Button>
              </div>
              {status ? <p className="rounded-md border border-vine/20 bg-glasshouse px-3 py-2 text-sm leading-6 text-moss/75">{status}</p> : null}
            </form>
          </CardContent>
        </Card>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid content-start gap-4 rounded-lg border border-vine/25 bg-paper p-5 shadow-plate"
        >
          <button
            type="button"
            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border border-moss/15 bg-glasshouse text-left transition-colors hover:border-vine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
            onClick={setFocusFromPreview}
          >
            <WishImage
              imageURI={focusedImageURI}
              previewSrc={localImagePreview}
              alt=""
              className="h-full w-full object-cover"
              fallback={
                <div className="grid h-full place-items-center">
                <div className="grid place-items-center gap-2 text-vine/65">
                  <Image className="h-12 w-12" aria-hidden="true" />
                  <span className="font-mono text-xs text-vine opacity-0 transition-opacity group-hover:opacity-100">upload plate</span>
                </div>
              </div>
              }
              failureFallback={<PreviewImageFailure />}
            />
            {draft.imageURI || localImagePreview ? (
              <span
                className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-clay shadow-sm ring-1 ring-moss/25"
                style={{ left: `${imageFocus.x}%`, top: `${imageFocus.y}%` }}
                aria-hidden="true"
              />
            ) : null}
            <span className="absolute left-3 top-3 rounded-sm border border-moss/25 bg-paper/95 px-2 py-1 font-mono text-xs text-moss">No. draft</span>
            <span className="absolute right-3 top-3 rounded-sm bg-clay px-2 py-1 font-mono text-xs text-paper">new</span>
          </button>
          <div>
            <h3 className="font-display text-2xl font-medium leading-tight text-moss">{draft.title || "Untitled specimen"}</h3>
            <p className="mt-2 text-sm leading-6 text-moss/70">{draft.description || "A short note will appear here as people browse the catalog."}</p>
          </div>
          <div className="rounded-md border border-vine/15 bg-glasshouse px-3 py-2">
            <SpecimenGrowth progress={64} size="sm" wishKey="create-preview" />
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-sm mono-tabular">
            <div className="rounded-md border border-moss/15 bg-glasshouse p-3">
              <p className="text-moss/60">Goal</p>
              <p className="text-vine">{draft.goal || "open"} USDC</p>
            </div>
            <div className="rounded-md border border-clay/25 bg-glasshouse p-3">
              <p className="text-moss/60">Collects</p>
              <p className="truncate text-clay">{draft.recipient || wallet.address || "wallet"}</p>
            </div>
          </div>
        </motion.aside>
      </div>

      <MotionConfirmDialog
        open={reviewOpen}
        title="Plant this specimen?"
        description="Review the plate before it is registered on Arc. Donations are final once a wish is planted and watered."
        confirmLabel={wallet.address ? "Plant this wish" : "Connect wallet"}
        onConfirm={() => void handleSubmit(onSubmit)()}
        onClose={() => setReviewOpen(false)}
      >
        <div className="grid gap-2">
          <p className="font-display text-xl font-medium text-moss">{draft.title || "Untitled specimen"}</p>
          <p className="text-sm leading-6 text-moss/70">{draft.description || "No description yet."}</p>
          <p className="font-mono text-sm text-vine mono-tabular">Goal: {draft.goal || "open-ended"} USDC</p>
        </div>
      </MotionConfirmDialog>
    </section>
  );
}

function PreviewImageFailure() {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div className="grid max-w-xs place-items-center gap-2 text-moss/70">
        <Image className="h-10 w-10 text-clay" aria-hidden="true" />
        <p className="text-sm leading-6">Image is not reachable from its gateways. Upload again or paste a reachable image URL.</p>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function normalizeFocus(value: string | number | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 50;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}
