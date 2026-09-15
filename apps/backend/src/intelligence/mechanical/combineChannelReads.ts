import type { DisplayRelationship, FamilyMechanicalRead, MechanicalChannelId } from "@gold-terminal/contracts";

export interface ChannelReadInput {
  channelId: MechanicalChannelId;
  read: DisplayRelationship;
}

/**
 * Shared combination rule reused by every family's aggregation and, within
 * a family, reused again to first combine KPIs sharing ONE channel into a
 * single channel-level read before combining across channels — this is what
 * guarantees `contributingChannels` never lists more entries than distinct
 * channels involved (e.g. MM Net % + MM WoW both resolve to one
 * FUTURES_POSITIONING entry, never two separate votes).
 *
 * Kept in its own module (not familyAggregation.ts) purely to avoid a
 * circular import between familyAggregation.ts (which dispatches to
 * families/*.ts) and families/*.ts (which need this helper) — re-exported
 * from familyAggregation.ts so it still reads as "the shared aggregation
 * helper" from a caller's perspective.
 *
 * - All non-CONTEXTUAL reads agree -> that read, CHANNELS_AGREE.
 * - Exactly one non-CONTEXTUAL read -> that read, SINGLE_CHANNEL_AVAILABLE.
 * - They disagree -> CONTEXTUAL, CHANNELS_DISAGREE.
 * - None available -> CONTEXTUAL, NO_CHANNEL_AVAILABLE.
 */
export function combineChannelReads(reads: readonly ChannelReadInput[]): {
  read: DisplayRelationship;
  reasonCode: FamilyMechanicalRead["reasonCode"];
  contributingChannels: MechanicalChannelId[];
} {
  const available = reads.filter((r) => r.read !== "CONTEXTUAL");

  if (available.length === 0) {
    return { read: "CONTEXTUAL", reasonCode: "NO_CHANNEL_AVAILABLE", contributingChannels: [] };
  }

  const distinctChannels = Array.from(new Set(available.map((r) => r.channelId)));

  if (available.length === 1) {
    return { read: available[0].read, reasonCode: "SINGLE_CHANNEL_AVAILABLE", contributingChannels: distinctChannels };
  }

  const allAgree = available.every((r) => r.read === available[0].read);
  if (allAgree) {
    return { read: available[0].read, reasonCode: "CHANNELS_AGREE", contributingChannels: distinctChannels };
  }

  return { read: "CONTEXTUAL", reasonCode: "CHANNELS_DISAGREE", contributingChannels: distinctChannels };
}
