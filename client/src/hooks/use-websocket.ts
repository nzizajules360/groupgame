import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/routes';
import { useToast } from './use-toast';

type WSMessage = 
  | { type: 'join_room'; roomId: number; userId: number }
  | { type: 'team_change'; roomId: number; userId: number; team: string }
  | { type: 'chat'; content: string; team?: string }
  | { type: 'spin' }
  | { type: 'game_update'; roomId: number }
  | { type: 'error'; message: string };

export function useWebSocket(roomId: number) {
  const socketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsUrl = `${protocol}${window.location.host}/ws?roomId=${roomId}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to game server');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from game server');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'game_update':
          case 'team_change':
          case 'join_room':
            // Invalidate room data to trigger refetch
            queryClient.invalidateQueries({ queryKey: [api.rooms.get.path, roomId] });
            break;
            
          case 'chat':
            // Invalidate messages
            queryClient.invalidateQueries({ queryKey: [api.messages.list.path, roomId] });
            break;
            
          case 'error':
            toast({ 
              title: "Error", 
              description: message.message, 
              variant: "destructive" 
            });
            break;
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId, queryClient, toast]);

  const send = (msg: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('WebSocket not connected');
    }
  };

  return { isConnected, send };
}
