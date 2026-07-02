import CircularProgress from "@mui/material/CircularProgress";

export function SkeletonCard({ height = 'h-24 '}){

    return(
        <div className={`flex flex-col items-center justify-center animate-pulse bg-gray-200 rounded-2xl w-full ${height}`}>
            <CircularProgress size={20} color="inherit" />
        </div>
    );
}