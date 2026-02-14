import { IMessage } from '../types';
import { BaseRepository } from './BaseRepository';
declare class MessageRepository extends BaseRepository<IMessage> {
    constructor();
    findLastMessage(chatId: string): Promise<any>;
    countUnread(chatId: string, userId: string): Promise<any>;
    getChatMessages(chatId: string, page: number, limit: number): Promise<{
        messages: any;
        total: any;
    }>;
    markAsRead(chatId: string, userId: string): Promise<any>;
    deleteByChatId(chatId: string): Promise<any>;
    countUnreadAcross(chatIds: string[], userId: string): Promise<any>;
}
export declare const messageRepository: MessageRepository;
export default messageRepository;
//# sourceMappingURL=MessageRepository.d.ts.map