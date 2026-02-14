<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = $request->user()->contacts();

        // Filter: Search (Name)
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter: Type
        if ($request->type) {
            $query->where('type', $request->type);
        }

        // Sorting & Pagination
        $contacts = $query->orderBy('name', 'asc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['CUSTOMER', 'SUPPLIER', 'BOTH'])],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
        ]);

        $request->user()->contacts()->create($validated);

        return redirect()->back()->with('success', 'Kontak berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contact $contact)
    {
        if ($contact->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['CUSTOMER', 'SUPPLIER', 'BOTH'])],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
        ]);

        $contact->update($validated);

        return redirect()->back()->with('success', 'Kontak berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Contact $contact)
    {
        if ($contact->user_id !== auth()->id()) {
            abort(403);
        }

        $contact->delete();

        return redirect()->back()->with('success', 'Kontak berhasil dihapus.');
    }
}
