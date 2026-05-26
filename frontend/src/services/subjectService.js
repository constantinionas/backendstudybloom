import api from "./api";

function normalizeSubjectFromApi(subject) {
  return {
    id: subject.id,
    name: subject.name,
    createdAt: subject.created_at || subject.createdAt,
  };
}

export async function listSubjects() {
  try {
    const response = await api.get("/subjects");

    return response.data.map(normalizeSubjectFromApi);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Materiile nu au putut fi încărcate."
    );
  }
}

export async function getSubjectById(subjectId) {
  try {
    const response = await api.get(`/subjects/${subjectId}`);

    return normalizeSubjectFromApi(response.data);
  } catch (requestError) {
    if (requestError.response?.status === 404) {
      return null;
    }

    throw new Error(
      requestError.response?.data?.detail ||
        "Materia nu a putut fi încărcată."
    );
  }
}

export async function createSubject(name) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Introdu numele materiei.");
  }

  try {
    const response = await api.post("/subjects", {
      name: trimmedName,
    });

    return normalizeSubjectFromApi(response.data);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Materia nu a putut fi creată."
    );
  }
}

export async function renameSubject(subjectId, newName) {
  const trimmedName = newName.trim();

  if (!trimmedName) {
    throw new Error("Numele materiei nu poate fi gol.");
  }

  try {
    const response = await api.patch(`/subjects/${subjectId}`, {
      name: trimmedName,
    });

    return normalizeSubjectFromApi(response.data);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Materia nu a putut fi redenumită."
    );
  }
}

export async function deleteSubject(subjectId) {
  try {
    await api.delete(`/subjects/${subjectId}`);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Materia nu a putut fi ștearsă."
    );
  }
}