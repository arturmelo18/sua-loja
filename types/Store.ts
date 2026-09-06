export interface StoreSlide {
    _id?: string
    title: string
    description: string
    image: string
}

export interface Store {
    _id: string
    ownerId: string
    store: string
    name: string
    color?: string
    active: boolean
    approvalStatus?: 'pending' | 'approved' | 'rejected'
    slides: StoreSlide[]
    createdAt: Date
    updatedAt: Date
}