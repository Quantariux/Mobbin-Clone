import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth";
import {
  createCollection,
  getUserCollections,
  removeScreenFromCollection,
  saveScreenToCollection,
} from "./queries";

/**
 * Saved-screen state + toggle backed by the user's default collection.
 * RLS keys collections to auth.uid(), so no extra scoping is needed here.
 */
export function useSavedScreens() {
  const { user, openAuth } = useAuth();
  const queryClient = useQueryClient();

  const { data: collections } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: getUserCollections,
    enabled: Boolean(user),
  });

  const savedIds = useMemo(
    () =>
      new Set(
        (collections ?? []).flatMap((c) => c.collection_screens.map((cs) => cs.screen_id)),
      ),
    [collections],
  );

  const toggle = useMutation({
    mutationFn: async (screenId) => {
      const collection = collections?.[0] ?? (await createCollection());
      if (savedIds.has(screenId)) {
        await removeScreenFromCollection(collection.id, screenId);
      } else {
        await saveScreenToCollection(collection.id, screenId);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  return {
    savedIds,
    isSaved: (screenId) => savedIds.has(screenId),
    toggleSave: (screenId) => {
      if (!user) {
        openAuth("signin");
        return;
      }
      toggle.mutate(screenId);
    },
  };
}
