/// \u003creference types="vite/client" /\u003e

interface ImportMetaEnv {
    readonly VITE_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
