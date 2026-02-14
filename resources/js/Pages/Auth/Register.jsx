import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import { UserPlus, User, Mail, Lock } from "lucide-react";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gray-100 p-4 bg-cover bg-center relative"
            style={{
                backgroundImage: "url('/images/local/bg-login.png')",
            }}
        >
            <div className="absolute inset-0 bg-black/60" />

            <Head title="Register" />

            <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/50 relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                        <UserPlus size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Buat Akun Baru
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                        Bergabunglah sekarang untuk mulai mencatat keuangan
                        Anda.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <InputLabel
                            htmlFor="name"
                            value="Name"
                            className="sr-only"
                        />
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <User size={18} />
                            </div>
                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                className="pl-10 block w-full rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500"
                                placeholder="Nama Lengkap"
                                autoComplete="name"
                                isFocused={true}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                required
                            />
                        </div>
                        <InputError message={errors.name} className="mt-2" />
                    </div>

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
                                placeholder="Alamat Email"
                                autoComplete="username"
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                required
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
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                required
                            />
                        </div>
                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                            className="sr-only"
                        />
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="pl-10 block w-full rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500"
                                placeholder="Konfirmasi Password"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </div>
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex items-center justify-end mt-4">
                        <Link
                            href={route("login")}
                            className="text-sm text-gray-600 hover:text-red-600 underline rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Sudah punya akun?
                        </Link>
                    </div>

                    <PrimaryButton
                        className="w-full justify-center h-11 bg-red-600 hover:bg-red-700 rounded-xl text-base shadow-lg shadow-red-200 transition-all hover:shadow-red-300"
                        disabled={processing}
                    >
                        Daftar Sekarang
                    </PrimaryButton>
                </form>
            </div>
        </div>
    );
}
