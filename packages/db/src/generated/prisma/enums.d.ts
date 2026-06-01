export declare const ApplicationStatus: {
    readonly SEND: "SEND";
    readonly REVIEWING: "REVIEWING";
    readonly ACCEPTED: "ACCEPTED";
    readonly DECLINED: "DECLINED";
    readonly TRIAL: "TRIAL";
};
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];
export declare const ApplicationQuestionType: {
    readonly TEXT: "TEXT";
    readonly SHORT_INPUT: "SHORT_INPUT";
    readonly LONG_INPUT: "LONG_INPUT";
    readonly DROPDOWN: "DROPDOWN";
    readonly CITY: "CITY";
    readonly URL: "URL";
    readonly MINECRAFT: "MINECRAFT";
    readonly SLIDER: "SLIDER";
    readonly IMAGE: "IMAGE";
    readonly CHECKBOX: "CHECKBOX";
};
export type ApplicationQuestionType = (typeof ApplicationQuestionType)[keyof typeof ApplicationQuestionType];
