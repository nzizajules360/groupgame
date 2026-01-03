import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateRoomRequest, type JoinRoomRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useGame() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomRequest) => {
      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create room");
      return api.rooms.create.responses[201].parse(await res.json());
    },
    onSuccess: (room) => {
      toast({ title: "Room Created!", description: `Code: ${room.code}` });
      setLocation(`/game/${room.id}`);
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoomRequest) => {
      const res = await fetch(api.rooms.join.path, {
        method: api.rooms.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Room not found");
        throw new Error("Failed to join room");
      }
      return api.rooms.join.responses[200].parse(await res.json());
    },
    onSuccess: (room) => {
      toast({ title: "Joined Room!", description: "Welcome to the game." });
      setLocation(`/game/${room.id}`);
    },
    onError: (err) => {
      toast({ title: "Could not join", description: err.message, variant: "destructive" });
    },
  });

  return {
    createRoom: createRoomMutation,
    joinRoom: joinRoomMutation,
  };
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: [api.rooms.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.rooms.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch room");
      return api.rooms.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useRoomMessages(id: number) {
  return useQuery({
    queryKey: [api.messages.list.path, id],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
