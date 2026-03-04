import React from 'react'

const InfoPage = () => {
    return (
        <div className="h-fit md:ml-36 md:mr-36 p-4 m-3">
            <div
                id="heading"
                className="bg-base-200/80  shadow-md border border-base-300 px-6 py-5 md:px-8 md:py-7 flex flex-col gap-4"
            >
                <h1 className="text-3xl max-md:text-2xl font-extrabold leading-snug">
                    An open source project with aims for:
                    <span className="block text-primary mt-1">
                        “A very simple and easy to use JOURNAL”
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