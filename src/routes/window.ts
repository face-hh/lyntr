declare interface Window {
    dataLayer: IArguments[],
    gtag?: (...args: any[]) => void
}