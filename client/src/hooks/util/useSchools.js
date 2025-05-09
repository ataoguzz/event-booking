import { useEffect, useState } from "react";

export const useSchools = () => {
    const [schoolsByCity, setSchoolsByCity] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("/school_list.csv")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to fetch the school list.");
                return response.text();
            })
            .then((csvText) => {
                const rows = csvText.split("\n").map((row) => row.trim());
                const map = new Map();

                rows.forEach((row) => {
                    const [schoolName, city, yksscore, bilkentScore, priorityScore] = row.split(",");
                    const school = {
                        name: schoolName,
                        city: city,
                        yksscore: parseFloat(yksscore),
                        bilkentScore: parseFloat(bilkentScore),
                        priorityScore: parseFloat(priorityScore),
                    };
                    if (!map.has(city)) {
                        map.set(city, []);
                    }
                    map.get(city).push(school);
                });

                setSchoolsByCity(map);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return { schoolsByCity, loading, error };
};
