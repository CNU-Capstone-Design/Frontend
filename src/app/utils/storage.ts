import { api } from "./api";
import { Simulation, FacePart, Modification } from "../types/simulation";

interface ApiSimulation {
  simulation_id: string;
  name: string;
  thumbnail: string | null;
  face_parts: FacePart[];
  modifications: Modification[];
  created_at: string;
  image_id: string | null;
}

function mapToSimulation(s: ApiSimulation): Simulation {
  return {
    id: s.simulation_id,
    name: s.name,
    createdAt: new Date(s.created_at),
    originalImage: s.thumbnail ?? "",
    resultImage: s.thumbnail ?? "",
    faceParts: s.face_parts ?? [],
    modifications: s.modifications ?? [],
  };
}

export async function getSimulations(): Promise<Simulation[]> {
  const data = await api.get<ApiSimulation[]>("/gallery");
  return data.map(mapToSimulation);
}

export async function saveSimulation(
  simulation: Simulation,
  imageId?: string
): Promise<void> {
  await api.post("/gallery", {
    simulation_id: simulation.id,
    name: simulation.name,
    image_id: imageId ?? null,
    thumbnail: simulation.originalImage,
    face_parts: simulation.faceParts,
    modifications: simulation.modifications,
  });
}

export async function getSimulation(id: string): Promise<Simulation | null> {
  try {
    const data = await api.get<ApiSimulation>(`/gallery/${id}`);
    return mapToSimulation(data);
  } catch {
    return null;
  }
}

export async function deleteSimulation(id: string): Promise<void> {
  await api.delete(`/gallery/${id}`);
}
