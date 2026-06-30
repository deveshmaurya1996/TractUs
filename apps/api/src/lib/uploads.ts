import fs from "fs";
import path from "path";
import multer from "multer";

const apiRoot = path.resolve(__dirname, "../..");
export const uploadsRoot = path.join(apiRoot, "uploads");

export function pdfPath(organizationId: string, contractId: string): string {
  return path.join(uploadsRoot, organizationId, `${contractId}.pdf`);
}

export function ensureUploadDir(organizationId: string): string {
  const dir = path.join(uploadsRoot, organizationId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        const organizationId = req.query.organizationId as string;
        cb(null, ensureUploadDir(organizationId));
      } catch (error) {
        cb(error as Error, "");
      }
    },
    filename: (req, _file, cb) => {
      cb(null, `${req.params.id}.pdf`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});
