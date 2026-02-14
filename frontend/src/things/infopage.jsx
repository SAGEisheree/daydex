import React from 'react'

const InfoPage = () => {
    return (
        <div>
            <div className="h-fit md:ml-40 md:mr-40 p-4 pb-0 m-3">
                <div id="heading">
                    <h1 className="text-3xl max-md:text-xl font-bold">An open source non profit project built with a goal "A very simple and easy to use JOURNAL"</h1>
                    <div className="bg-base-200 p-4">
                    <p className="mt-2 max-md:text-sm text-xl">With the help of DAYDEX, You can save your memories here.<br/> Your data doesnt get collected. <br/> NOTE: Still in building phase. Check dev logs for more</p>
                    <p className="mt-2 max-md:text-sm text-xl"> Click on any day to assign Notes and mood colors. </p>
                </div>
                </div>
            </div>
        </div>
    )
}

export default InfoPage