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
  | { type: 'wrong_answer'; team: string; userId: number }
  | { type: 'submit_team_question'; roomId: number; question: string; answer: string }
  | { type: 'select_player'; roomId: number; playerId: number }
  | { type: 'answer_question'; roomId: number; answer: string }
  | { type: 'question_state'; roomId: number; question: string; authorTeam: 'red' | 'blue'; canAnswer: boolean; selectedPlayerId?: number; timeLeft?: number }
  | { type: 'answer_result'; roomId: number; correct: boolean; answeringTeam: 'red' | 'blue'; question: string; answer?: string }
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
          case 'wrong_answer':
            // Custom event will be handled by component
            window.dispatchEvent(new CustomEvent('wrong_answer', { detail: message }));
            break;
          case 'question_state':
          case 'answer_result':
            // Invalidate room to trigger refetch for scores
            queryClient.invalidateQueries({ queryKey: [api.rooms.get.path, roomId] });
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
