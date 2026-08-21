import {
  CLUB_ROGUE_GACHIBOWLI_ID,
  clubRogueNightGenreLabel,
  isClubRogueBrand,
  resolveClubRogueNightGenre,
} from "@/lib/club-rogue";

export function buildClubRogueReservationNotes(params: {
  brandId: string;
  notes?: unknown;
  eventId?: unknown;
  bookingNightGenre?: unknown;
}): { notes: string | null; nightGenre: "tollywood" | "bollywood" | null; error?: string } {
  const { brandId } = params;
  const userNotesTrimmed =
    typeof params.notes === "string" && params.notes.trim() ? params.notes.trim() : "";

  let nightGenre: "tollywood" | "bollywood" | null = null;
  if (isClubRogueBrand(brandId)) {
    nightGenre = resolveClubRogueNightGenre(brandId, params.bookingNightGenre);
    if (brandId === CLUB_ROGUE_GACHIBOWLI_ID && !nightGenre) {
      return {
        notes: null,
        nightGenre: null,
        error: "Please select Tollywood night or Bollywood night.",
      };
    }
    if (!nightGenre) nightGenre = "tollywood";
  }

  const eventIdNormalized =
    typeof params.eventId === "string" && params.eventId.trim()
      ? params.eventId.trim()
      : null;

  const dbNotesParts: string[] = [];
  if (isClubRogueBrand(brandId) && nightGenre) {
    dbNotesParts.push(clubRogueNightGenreLabel(nightGenre));
  }
  if (userNotesTrimmed) dbNotesParts.push(userNotesTrimmed);

  const notes =
    [
      dbNotesParts.length > 0 ? dbNotesParts.join("\n") : "",
      eventIdNormalized ? `[event:${eventIdNormalized}]` : "",
    ]
      .filter(Boolean)
      .join("\n")
      .trim() || null;

  return { notes, nightGenre };
}
