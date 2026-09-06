export interface StoreSlide {
    _id?: string
    title: string
    description: string
    image: string
}

export interface Store {
    _id: string
    store: string
    name: string
    slides: StoreSlide[]
    createdAt: Date
    updatedAt: Date
}