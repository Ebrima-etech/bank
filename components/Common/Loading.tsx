export default function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-primary-600" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
