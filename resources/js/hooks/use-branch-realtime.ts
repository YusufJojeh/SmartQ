import { useEffect } from 'react';

const QUEUE_EVENTS = ['.ticket.joined', '.ticket.called', '.ticket.completed', '.ticket.cancelled'] as const;

export function useBranchRealtime(branchId: number | null | undefined, onQueueChange: () => void) {
    useEffect(() => {
        if (!branchId || !window.Echo) {
            return;
        }

        const channelName = `branch.${branchId}`;
        const channel = window.Echo.channel(channelName);

        QUEUE_EVENTS.forEach((event) => {
            channel.listen(event, onQueueChange);
        });

        return () => {
            QUEUE_EVENTS.forEach((event) => {
                channel.stopListening(event);
            });
            window.Echo?.leaveChannel(channelName);
        };
    }, [branchId, onQueueChange]);
}
