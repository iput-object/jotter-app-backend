const httpStatus = require("http-status");
const { userModel } = require("../user");
const { fileModel } = require("../file");
const { folderModel } = require("../folder");
const ApiError = require("../../utils/ApiError");
const paginateArray = require("../../utils/pagination");

const getAllFileTypes = async (userId) => {
  return await fileModel.distinct("fileType", { userId, isTrashed: false });
};

const getItemsByType = async (userId, filter, options) => {
  const query = {
    userId,
    isTrashed: false,
    isLocked: false,
  };

  for (const key of Object.keys(filter)) {
    if (key === "fileType" && filter[key] !== "") {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  return await fileModel.paginate(query, query, {
    ...options,
    sort: options.sortBy || "createdAt:desc",
  });
};

const getCategoryMimeTypes = (category) => {
  const categories = {
    images: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ],
    videos: [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/webm",
    ],
    documents: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      "application/rtf",
    ],
    audio: [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp3",
      "audio/aac",
      "audio/flac",
    ],
    archives: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
      "application/gzip",
    ],
  };

  return categories[category] || [];
};

const getFilesBySpecificCategory = async (userId, category, options) => {
  const mimeTypes = getCategoryMimeTypes(category);

  let query = {
    userId,
    isTrashed: false,
  };

  if (category === "others") {
    // Get all mime types from all categories
    const allCategories = [
      "images",
      "videos",
      "documents",
      "audio",
      "archives",
    ];
    const allMimeTypes = allCategories.flatMap((cat) =>
      getCategoryMimeTypes(cat)
    );

    query.fileType = { $nin: allMimeTypes };
  } else {
    query.fileType = { $in: mimeTypes };
  }

  const result = await fileModel.paginate(query, {
    ...options,
    sort: options.sortBy || "createdAt:desc",
  });

  return result;
};

const getFilesByCategory = async (userId) => {
  const categories = {
    images: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    videos: ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"],
    documents: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"],
    archives: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
    ],
  };

  const categorizedFiles = {};

  for (const [category, mimeTypes] of Object.entries(categories)) {
    const files = await fileModel.find({
      userId,
      fileType: { $in: mimeTypes },
      isTrashed: false,
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    categorizedFiles[category] = {
      count: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  }

  // Others category
  const allCategorizedMimeTypes = Object.values(categories).flat();
  const otherFiles = await fileModel.find({
    userId,
    fileType: { $nin: allCategorizedMimeTypes },
    isTrashed: false,
  });

  const otherTotalSize = otherFiles.reduce((sum, file) => sum + file.size, 0);

  categorizedFiles.others = {
    count: otherFiles.length,
    totalSize: otherTotalSize,
    totalSizeMB: (otherTotalSize / (1024 * 1024)).toFixed(2),
  };

  return categorizedFiles;
};

const getFileCounts = async (userId) => {
  const totalFiles = await fileModel.countDocuments({
    userId,
    isTrashed: false,
  });
  const trashedFiles = await fileModel.countDocuments({
    userId,
    isTrashed: true,
  });
  const lockedFiles = await fileModel.countDocuments({
    userId,
    isLocked: true,
  });

  return {
    total: totalFiles,
    trashed: trashedFiles,
    locked: lockedFiles,
    active: totalFiles - lockedFiles,
  };
};

const getFolderCounts = async (userId) => {
  const totalFolders = await folderModel.countDocuments({
    userId,
    isTrashed: false,
  });
  const trashedFolders = await folderModel.countDocuments({
    userId,
    isTrashed: true,
  });

  return {
    total: totalFolders,
    trashed: trashedFolders,
    active: totalFolders,
  };
};

const getRecentItems = async (userId, options) => {
  const [files, folders] = await Promise.all([
    fileModel
      .find({ userId, isTrashed: false })
      .sort({ createdAt: -1 })
      .select("name originalName fileType size path createdAt updatedAt")
      .lean(),
    folderModel
      .find({ userId, isTrashed: false })
      .sort({ createdAt: -1 })
      .select("name parent createdAt updatedAt")
      .lean(),
  ]);

  const combined = [...files, ...folders];
  return paginateArray(combined, {
    ...options,
    sort: options.sortBy || "createdAt:desc",
  });
};

const getHomepageCards = async (userId) => {
  const storage = await getStorageStats(userId);
  const folderCount = await folderModel.countDocuments({ userId });
  const folders = await folderModel.find({ userId });
  const folderSize = folders.reduce((sum, folder) => sum + folder.size, 0);

  // Notes card (txt, word, etc)
  const notesMimeTypes = [
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf",
    "text/markdown",
  ];
  const notes = await fileModel.find({
    userId,
    fileType: { $in: notesMimeTypes },
    isTrashed: false,
  });
  const notesSize = notes.reduce((sum, file) => sum + file.size, 0);

  // Images card
  const imagesMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
  ];

  const images = await fileModel.find({
    userId,
    fileType: { $in: imagesMimeTypes },
    isTrashed: false,
  });
  const imagesSize = images.reduce((sum, file) => sum + file.size, 0);

  // PDFs card
  const pdfs = await fileModel.find({
    userId,
    fileType: "application/pdf",
    isTrashed: false,
  });
  const pdfsSize = pdfs.reduce((sum, file) => sum + file.size, 0);

  // Recent items
  const recentItems = await getRecentItems(userId, 20, true);

  return {
    storage: {
      total: storage.total,
      used: storage.used,
      remaining: storage.remaining,
      usagePercentage: storage.usagePercentage,
      totalGB: storage.totalGB,
      usedGB: storage.usedGB,
      remainingGB: storage.remainingGB,
    },

    folders: {
      count: folderCount,
      totalSize: folderSize,
    },
    notes: {
      count: notes.length,
      totalSize: notesSize,
      totalSizeMB: (notesSize / (1024 * 1024)).toFixed(2),
    },
    images: {
      count: images.length,
      totalSize: imagesSize,
      totalSizeMB: (imagesSize / (1024 * 1024)).toFixed(2),
    },
    pdfs: {
      count: pdfs.length,
      totalSize: pdfsSize,
      totalSizeMB: (pdfsSize / (1024 * 1024)).toFixed(2),
    },
    recentItems,
  };
};

const getStorageStats = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const totalStorage = user.storage.total;
  const usedStorage = user.storage.used;
  const remainingStorage = totalStorage - usedStorage;
  const usagePercentage = ((usedStorage / totalStorage) * 100).toFixed(2);

  return {
    total: totalStorage,
    used: usedStorage,
    remaining: remainingStorage,
    usagePercentage: parseFloat(usagePercentage),
    totalGB: (totalStorage / (1024 * 1024 * 1024)).toFixed(2),
    usedGB: (usedStorage / (1024 * 1024 * 1024)).toFixed(2),
    remainingGB: (remainingStorage / (1024 * 1024 * 1024)).toFixed(2),
  };
};

const getDetailedStats = async (userId) => {
  const storage = await getStorageStats(userId);
  const fileCounts = await getFileCounts(userId);
  const folderCounts = await getFolderCounts(userId);
  const filesByCategory = await getFilesByCategory(userId);

  // Get largest files
  const largestFiles = await fileModel
    .find({ userId, isTrashed: false })
    .sort({ size: -1 })
    .limit(10)
    .select("name originalName fileType size createdAt");

  // Get file type distribution
  const fileTypeDistribution = await fileModel.aggregate([
    { $match: { userId, isTrashed: false } },
    {
      $group: {
        _id: "$fileType",
        count: { $sum: 1 },
        totalSize: { $sum: "$size" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    storage,
    files: fileCounts,
    folders: folderCounts,
    filesByCategory,
    largestFiles,
    fileTypeDistribution,
  };
};

module.exports = {
  getHomepageCards,
  getAllFileTypes,
  getItemsByType,
  getStorageStats,
  getFilesByCategory,
  getFilesBySpecificCategory,
  getDetailedStats,
  getRecentItems,
};
