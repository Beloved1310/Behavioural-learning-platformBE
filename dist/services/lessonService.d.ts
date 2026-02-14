export declare class LessonService {
    static getLessons(filters: {
        subject?: string;
        topic?: string;
        type?: string;
    }): Promise<{
        id: any;
        title: any;
        subject: any;
        topic: any;
        type: any;
        description: any;
        content: any;
        estimatedDuration: any;
        order: any;
        createdAt: any;
    }[]>;
    static getLessonById(id: string): Promise<{
        id: any;
        title: any;
        subject: any;
        topic: any;
        type: any;
        description: any;
        content: any;
        estimatedDuration: any;
        order: any;
        createdAt: any;
    }>;
    static getTopicsBySubject(subject: string): Promise<any[]>;
}
export default LessonService;
//# sourceMappingURL=lessonService.d.ts.map