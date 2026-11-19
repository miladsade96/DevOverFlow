import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/context/ThemeProvider";
import Navbar from "@/components/shared/navbar/Navbar";
import LeftSidebar from "@/components/shared/LeftSidebar";
import QuestionCard from "@/components/cards/QuestionCard";
import Question from "@/components/forms/Question";
import Profile from "@/components/forms/Profile";
import HomeFilters from "@/components/home/HomeFilters";
import LocalSearchbar from "@/components/shared/search/LocalSearchbar";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "./router";
import Link from "./link";
import "@/styles/globals.css";
const fixtureTime = Date.now();
const id = "a".repeat(24);
const samples = [
  "How should I handle async errors in a React form?",
  "What is the best way to paginate MongoDB results?",
  "How can I make navigation work well on mobile?",
];
function App() {
  const path = usePathname();
  return (
    <ThemeProvider>
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          zIndex: 100,
          background: "#101421",
          color: "white",
          padding: "8px 14px",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        Offline preview · sample data
      </div>
      <main className="background-light850_dark100 relative min-h-screen">
        <Navbar />
        <div className="flex">
          <LeftSidebar />
          <section className="flex min-h-screen flex-1 flex-col px-6 pb-6 pt-36 max-md:pb-14 sm:px-14">
            <div className="mx-auto w-full max-w-5xl">
              {path === "/ask-question" ? (
                <>
                  <h1 className="h1-bold text-dark100_light900">
                    Ask a public question
                  </h1>
                  <div className="mt-9">
                    <Question mongoUserId={JSON.stringify(id)} />
                  </div>
                </>
              ) : path.includes("/profile/") ? (
                <>
                  <h1 className="h1-bold text-dark100_light900">
                    Edit Profile
                  </h1>
                  <Profile
                    clerkId="user_preview"
                    user={JSON.stringify({
                      name: "Alex Morgan",
                      username: "alex",
                      bio: "",
                      location: "",
                      portfolioWebsite: "",
                    })}
                  />
                </>
              ) : (
                <>
                  <div className="flex-between gap-4">
                    <h1 className="h1-bold text-dark100_light900">
                      All Questions
                    </h1>
                    <Link
                      className="primary-gradient rounded-lg px-4 py-3 text-white"
                      href="/ask-question"
                    >
                      Ask a question
                    </Link>
                  </div>
                  <div className="mt-9">
                    <LocalSearchbar
                      route={path}
                      imgSrc="/assets/icons/search.svg"
                      iconPosition="left"
                      placeHolder="Search questions"
                      otherClasses=""
                    />
                  </div>
                  <HomeFilters />
                  <div className="mt-10 flex flex-col gap-6">
                    {samples.map((title, index) => (
                      <QuestionCard
                        key={title}
                        _id={id}
                        title={title}
                        tags={[
                          {
                            _id: "b".repeat(24),
                            name: index ? "mongodb" : "react",
                          },
                        ]}
                        author={{
                          _id: id,
                          clerkId: "user_sample",
                          name: "Sample developer",
                          picture: "/assets/icons/user.svg",
                        }}
                        upvotes={Array(index + 2).fill(id)}
                        views={124 + index * 100}
                        answers={[{}]}
                        createdAt={
                          new Date(fixtureTime - (index + 1) * 86400000)
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
        <Toaster />
      </main>
    </ThemeProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
