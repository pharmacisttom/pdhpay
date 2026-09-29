import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { validateSlip } from "@/modules/payment/validators/file";

describe("payment slip file normalization", () => {
  it("re-encodes images and strips metadata before storage", async () => {
    const source = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: "white",
      },
    })
      .withMetadata({ exif: { IFD0: { Artist: "patient-device" } } })
      .jpeg()
      .toBuffer();
    const result = await validateSlip(
      new File([source], "slip.jpg", { type: "image/jpeg" }),
    );
    const metadata = await sharp(result.bytes).metadata();

    expect(result.mime).toBe("image/jpeg");
    expect(result.ext).toBe("jpg");
    expect(metadata.exif).toBeUndefined();
  });

  it("rejects a declared image that is not an image", async () => {
    await expect(
      validateSlip(
        new File(["not an image"], "slip.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({ code: "INVALID_FILE" });
  });
});
