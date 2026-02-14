import { IChat } from '../types';
import { BaseRepository } from './BaseRepository';
declare class ChatRepository extends BaseRepository<IChat> {
    constructor();
    findUserChats(userId: string, search?: string): Promise<any>;
    findOrCreate(userId: string, otherUserId: string): Promise<any>;
    isParticipant(chatId: string, userId: string): Promise<any>;
    findExistingChat(userId: string, otherUserId: string): Promise<any>;
    createNewChat(userId: string, otherUserId: string, title?: string): Promise<any>;
}
export declare const chatRepository: ChatRepository;
export default chatRepository;
//# sourceMappingURL=ChatRepository.d.ts.map