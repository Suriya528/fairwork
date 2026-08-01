import type { User } from "@/types"

/**
 * Seed users. The first client + freelancer act as the "current session"
 * personas for demoing the two sides of the protocol.
 */
export const users: User[] = [
  {
    id: "usr_client_01",
    name: "Ava Chen",
    email: "ava@northwind.studio",
    role: "client",
    walletAddress: "0x1f9a7C4b2E5d8A3f6B0c1D4e7F2a9B3c5D6e8F0a",
    title: "Founder, Northwind Studio",
    location: "San Francisco, USA",
    joinedAt: "2025-02-14T10:00:00Z",
    rating: 4.9,
    reviewCount: 38,
    verified: true,
  },
  {
    id: "usr_free_01",
    name: "Marcus Reyes",
    email: "marcus.reyes@proton.me",
    role: "freelancer",
    walletAddress: "0x8B3c5D6e8F0a1f9A7c4B2e5D8a3F6b0C1d4E7f2A",
    title: "Senior Product Designer",
    location: "Lisbon, Portugal",
    joinedAt: "2024-11-03T09:30:00Z",
    rating: 4.95,
    reviewCount: 112,
    verified: true,
  },
  {
    id: "usr_free_02",
    name: "Priya Nair",
    email: "priya@devnair.io",
    role: "freelancer",
    walletAddress: "0x4E7f2A8b3C5d6E8f0A1f9a7C4b2E5d8A3f6B0c1D",
    title: "Full-Stack Engineer",
    location: "Bengaluru, India",
    joinedAt: "2025-01-22T14:15:00Z",
    rating: 4.8,
    reviewCount: 67,
    verified: true,
  },
  {
    id: "usr_client_02",
    name: "Daniel Okafor",
    email: "daniel@brightloop.co",
    role: "client",
    walletAddress: "0x2E5d8A3f6B0c1D4e7F2a9B3c5D6e8F0a1f9A7c4B",
    title: "Head of Growth, Brightloop",
    location: "London, UK",
    joinedAt: "2025-03-08T08:45:00Z",
    rating: 4.7,
    reviewCount: 21,
    verified: false,
  },
]

/** The signed-in persona used across placeholder pages. */
export const currentUser: User = users[0]

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}
