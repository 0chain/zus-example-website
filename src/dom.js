export const get = (id) => document.getElementById(id);

export const onClick = (id, callback) => {
  console.log(
    "id:",
    id,
    "document.getElementById(id)",
    document.getElementById(id)
  );
  document.getElementById(id).addEventListener("click", callback);
};

export const setHtml = (id, html) =>
  (document.getElementById(id).innerHTML = html);

export const readBytes = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(file);
  });
