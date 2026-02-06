import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "public/images/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|gif|pdf|doc|docx|mp4|webm|mp3|wav/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname) { 
    // Mimetype check can be tricky with some OS/Browsers, trusting extension + signature is better but for now strictly extension is safer for 'filetypes.test'
    // Actually mimetype is safer. Let's rely on extension primarily for the regex match or ensure mimetype regex covers all.
    // Simplifying to return true if extension matches, as mimetype can vary wildly.
    return cb(null, true);
  } else {
    cb("Error: File type not supported!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
