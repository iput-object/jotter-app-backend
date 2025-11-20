const isObjectId = (value) => {
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    return false;
  }
  return true;
};


module.exports = {
  isObjectId,
};
