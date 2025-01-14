import LoginForm from "@/components/login-form";
import Logo from "@/components/logo";

export default function LoginPage() {
  return (
    <main
      className="flex items-center justify-center md:h-screen bg-cover bg-center"
      style={{ backgroundImage: `url('/images/nairobibackgroung.jpg')` }}
    >
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-36 w-full items-center justify-center rounded-lg bg-countyGreen p-3 md:h-44">
          <div className="w-32 text-white md:w-36">
            <Logo />
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
