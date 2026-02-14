<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::where('user_id', $request->user()->id);

        // Filter: Search Name
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter: Type (INCOME / EXPENSE)
        if ($request->type) {
            $query->where('type', $request->type);
        }

        $categories = $query->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:INCOME,EXPENSE',
        ]);

        $request->user()->categories()->create($validated);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        if ($category->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:INCOME,EXPENSE',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Kategori diperbarui.');
    }

    public function destroy(Request $request, Category $category)
    {
        if ($category->user_id !== $request->user()->id) {
            abort(403);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Kategori dihapus.');
    }
}
