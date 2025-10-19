"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Props = {
  onUploaded?: (publicUrl: string) => void;
  bucket?: string; // default 'observation-photos'
  folder?: string; // default 'uploads'
  maxWidth?: number; // default 1600
  quality?: number; // 0..1 default 0.82
};

export default function PhotoUploader({
  onUploaded,
  bucket = "observation-photos",
  folder = "uploads",
  maxWidth = 1600,
  quality = 0.82,
}: Props) {
  const supabase = createClientComponentClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, maxWidth, quality);
    setPreview(URL.createObjectURL(compressed));

    setUploading(true);
    try {
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, compressed, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onUploaded?.(data.publicUrl);
    } catch (err: any) {
      alert(`Upload fejlede: ${err.message ?? err}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl px-4 py-2 bg-black text-white disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? "Uploader..." : "Vælg foto"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
      </div>

      {preview && (
        <div className="relative w-full max-w-md aspect-video overflow-hidden rounded-2xl border">
          <Image src={preview} alt="Preview" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
      )}
    </div>
  );
}

/** Compress image using canvas to JPEG */
async function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  const imgBitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / imgBitmap.width);
  const w = Math.round(imgBitmap.width * scale);
  const h = Math.round(imgBitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imgBitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
