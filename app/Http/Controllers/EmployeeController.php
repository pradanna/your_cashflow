<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Menampilkan daftar karyawan.
     */
    public function index(Request $request)
    {
        $query = User::where('parent_id', $request->user()->id)
            ->where('role', 'karyawan');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $employees = $query->latest()->get();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Menyimpan karyawan baru.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', Rules\Password::defaults()],
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'karyawan',
            'parent_id' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', 'Karyawan berhasil ditambahkan.');
    }

    /**
     * Memperbarui data karyawan.
     */
    public function update(Request $request, User $employee)
    {
        if ($employee->parent_id !== $request->user()->id || $employee->role !== 'karyawan') {
            abort(403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . $employee->id,
            'password' => ['nullable', Rules\Password::defaults()],
        ]);

        $employee->name = $request->name;
        $employee->email = $request->email;

        if ($request->filled('password')) {
            $employee->password = Hash::make($request->password);
        }

        $employee->save();

        return redirect()->back()->with('success', 'Data karyawan diperbarui.');
    }

    /**
     * Menghapus karyawan.
     */
    public function destroy(Request $request, User $employee)
    {
        if ($employee->parent_id !== $request->user()->id || $employee->role !== 'karyawan') {
            abort(403);
        }

        $employee->delete();

        return redirect()->back()->with('success', 'Karyawan berhasil dihapus.');
    }
}
