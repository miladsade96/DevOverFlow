import { ReactNode } from "react";
const user = {
  id: "user_preview",
  fullName: "Alex Morgan",
  username: "alex",
  imageUrl: "/icons/avatar.svg",
};
export function useUser() {
  return { user, isLoaded: true };
}
export function useAuth() {
  return { userId: user.id };
}
export function Show({
  children,
  when,
}: {
  children: ReactNode;
  when: string;
}) {
  return when === "signed-in" ? children : null;
}
export function UserButton() {
  return (
    <button
      aria-label="Sample account"
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "#337bca",
        color: "white",
      }}
    >
      AM
    </button>
  );
}
