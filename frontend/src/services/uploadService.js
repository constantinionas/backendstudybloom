import api from "./api";

export async function previewImport(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/import/preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}