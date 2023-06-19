var getExtension = s => {
  return s.substring(s.lastIndexOf(".") + 1);
};

var getFileName = s => {
  return s.substring(s.lastIndexOf("\\") + 1, s.lastIndexOf("."));
};
