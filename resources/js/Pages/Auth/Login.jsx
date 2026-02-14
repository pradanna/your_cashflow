import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import { LogIn, Mail, Lock } from "lucide-react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gray-100 p-4 bg-cover bg-center"
            style={{
                backgroundImage: "url('/images/local/bg-login.png')",
            }}
        >
            {" "}
            <div className="absolute inset-0 bg-black/60" />
            <Head title="Log in" />
            <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/50">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                        <LogIn size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Selamat Datang!
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                        Silakan masuk untuk mengelola keuangan Anda.
                    </p>
                </div>

                {status && (
                    <div className="mb-6 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="Email"
                            className="sr-only"
                        />
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Mail size={18} />
                            </div>
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="pl-10 block w-full rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500"
                                placeholder="Email Address"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                            />
                        </div>
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="pl-10 block w-full rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500"
                                placeholder="Password"
                                autoComplete="current-password"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                            />
                        </div>
                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData("remember", e.target.checked)
                                }
                                className="text-red-600 focus:ring-red-500 rounded"
                            />
                            <span className="ms-2 text-sm text-gray-600">
                                Ingat saya
                            </span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route("password.request")}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Lupa password?
                            </Link>
                        )}
                    </div>

                    <PrimaryButton
                        className="w-full justify-center h-11 bg-red-600 hover:bg-red-700 rounded-xl text-base shadow-lg shadow-red-200 transition-all hover:shadow-red-300 mt-2"
                        disabled={processing}
                    >
                        Masuk Sekarang
                    </PrimaryButton>
                </form>
            </div>
        </div>
    );
}
