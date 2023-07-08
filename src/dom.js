export const get = (id) => document.getElementById(id);

export const setValue = (id, value) =>
  (document.getElementById(id).value = value);

export const getByName = (name) => document.getElementsByName(name);

export const onClick = (id, callback) => {
  // console.log(
  //   "id:",
  //   id,
  //   "document.getElementById(id)",
  //   document.getElementById(id)
  // );
  document.getElementById(id).addEventListener("click", callback);
};

export const onClickGroup = (name, callback) => {
  // console.log(
  //   "name:",
  //   name,
  //   "document.getElementsByName(name)",
  //   document.getElementsByName(name)
  // );
  const elements = getByName(name);
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", callback);
  }
};

export const onChange = (id, callback) => {
  // console.log(
  //   "id:",
  //   id,
  //   "document.getElementById(id)",
  //   document.getElementById(id)
  // );
  document.getElementById(id).addEventListener("change", callback);
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
