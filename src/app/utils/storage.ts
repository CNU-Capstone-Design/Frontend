import { api } from "./api";
import { Simulation, FacePart, Modification } from "../types/simulation";

interface ApiSimulation {
  simulation_id: string;
  name: string;
  /** Before: FFHQ-aligned 이미지 썸네일 */
  thumbnail: string | null;
  /** After: AI 생성 결과 이미지 썸네일 */
  result_thumbnail: string | null;
  face_parts: FacePart[];
  modifications: Modification[];
  created_at: string;
  image_id: string | null;
  aligned_image_id: string | null;
}

function mapToSimulation(s: ApiSimulation): Simulation {
  return {
    id: s.simulation_id,
    name: s.name,
    createdAt: new Date(s.created_at),
    // before: FFHQ-aligned 썸네일
    originalImage: s.thumbnail ?? "",
    // after: result_thumbnail 이 있으면 사용, 없으면 thumbnail 과 동일 (구버전 호환)
    resultImage: s.result_thumbnail ?? s.thumbnail ?? "",
    faceParts: s.face_parts ?? [],
    modifications: s.modifications ?? [],
    imageId: s.image_id ?? undefined,
    alignedImageId: s.aligned_image_id ?? undefined,
  };
}

export async function getSimulations(): Promise<Simulation[]> {
  const data = await api.get<ApiSimulation[]>("/gallery");
  return data.map(mapToSimulation);
}

export async function saveSimulation(
  simulation: Simulation,
  imageId?: string,
  alignedImageId?: string,
): Promise<void> {
  await api.post("/gallery", {
    simulation_id:    simulation.id,
    name:             simulation.name,
    image_id:         imageId ?? null,
    aligned_image_id: alignedImageId ?? null,
    thumbnail:        simulation.originalImage,   // before (FFHQ-aligned)
    result_thumbnail: simulation.resultImage,     // after  (AI result)
    face_parts:       simulation.faceParts,
    modifications:    simulation.modifications,
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
