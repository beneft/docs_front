declare module 'ncalayer-js-client' {
    export class NCALayerClient {
        constructor(config?: {
            allowKmdHttpApi?: boolean;
            allowDebug?: boolean;
        });

        static basicsStorageAll: string;
        static basicsCMSParamsDetached: string;
        static basicsSignerSignAny: string;

        connect(): Promise<void>;

        basicsSignCMS(
            storage: string,
            data: string | ArrayBuffer | Blob | File,
            cmsParams: string,
            signer: string
        ): Promise<string>;
    }
}