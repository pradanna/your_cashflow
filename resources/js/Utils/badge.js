// Helper badge status
export const getStatusBadge = (status) => {
    switch (status) {
        case "PAID":
            return "bg-green-100 text-green-700 border-green-200";
        case "PARTIAL":
            return "bg-yellow-100 text-yellow-700 border-yellow-200";
        default:
            return "bg-red-100 text-red-700 border-red-200";
    }
};
