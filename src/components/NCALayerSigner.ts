import { NCALayerClient } from 'ncalayer-js-client';

export async function signDocumentWithNCALayer(documentBase64: string): Promise<string | null> {
    const client = new NCALayerClient();

    try {
        await client.connect();
    } catch (err) {
        alert("Ошибка подключения к NCALayer:\n" + err);
        return null;
    }

    try {
        const signature = await client.basicsSignCMS(
            NCALayerClient.basicsStorageAll,
            documentBase64,
            NCALayerClient.basicsCMSParamsDetached,
            NCALayerClient.basicsSignerSignAny
        );

        return signature;
    } catch (err: any) {
        if (err.canceledByUser) {
            alert("Подпись отменена пользователем.");
        } else {
            alert("Ошибка подписи:\n" + err);
        }
        return null;
    }
}