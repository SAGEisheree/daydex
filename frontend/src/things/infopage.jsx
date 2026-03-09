import React from 'react'

const InfoPage = () => {
    return (
        <div className="h-fit p-4 md:p-10">
            <div
                id="heading"
                className="flex flex-col gap-4"
            >
                <h1 className="text-2xl max-md:text-2xl font-extrabold leading-snug">
                    An open source project which aims for:
                    <span className="block  text-5xl mt-1">
                        “Minimal and easy to use JOURNAL”
                    </span>
                </h1>

                <div className="space-y-3 text-base md:text-lg">
                    <p>
                        <span className="font-semibold">DAYDEX</span> helps storing your memories in a simple format
                        <span className="block text-xs md:text-sm opacity-70 mt-1">
                            NOTE: Still in building phase. Check dev logs for more.
                        </span>
                    </p>
                    <p className="font-medium">
                        Click on any day to assign notes and mood colors.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default InfoPage