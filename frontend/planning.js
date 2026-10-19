(function() {
    const parameters = {
        ratedCapacityKg: 20,
        maximumFillFraction: 0.95,
        accumulationHours: 12,
        pickupsPerDay: 2,
        freshnessLimitHours: 24,
        morningPickup: '10:00',
        eveningPickup: '20:00',
        minimumPermanentBins: 2,
        regularVisitorsPerPermanentBin: 500
    };
    parameters.usableCapacityKg = parameters.ratedCapacityKg * parameters.maximumFillFraction;
    parameters.modelledPickupGapHours = parameters.accumulationHours / parameters.pickupsPerDay;

    const locations = [
        {
            id: 'raghunath',
            name: 'Shri Raghunath Temple',
            category: 'temple',
            role: 'Temple floral-waste source and proposed collection point.',
            lat: 32.7305119,
            lng: 74.8619781,
            templeId: 'raghunath'
        },
        {
            id: 'ranbireshwar',
            name: 'Ranbireshwar Temple',
            category: 'temple',
            role: 'Temple floral-waste source and proposed collection point.',
            lat: 32.73472,
            lng: 74.86406,
            templeId: 'ranbireshwar'
        },
        {
            id: 'shiv',
            name: 'Shiv Temple',
            category: 'temple',
            role: 'Temple floral-waste source and proposed collection point.',
            lat: 32.7275651,
            lng: 74.8486788,
            templeId: 'shiv'
        },
        {
            id: 'bawe',
            name: 'Bawe Wali Mata Mahakali Temple',
            category: 'temple',
            role: 'Temple floral-waste source and proposed collection point.',
            lat: 32.7266545,
            lng: 74.8803282,
            templeId: 'bawe'
        },
        {
            id: 'jk-aromatics',
            name: 'JK Aromatics and Herbs',
            category: 'partner',
            role: 'Potential processing partner; participation has not been confirmed.',
            lat: 32.7446352,
            lng: 74.8533631
        },
        {
            id: 'samast',
            name: 'Samast Eco-Alternatives Pvt. Ltd.',
            category: 'partner',
            role: 'Potential processing partner; participation has not been confirmed.',
            lat: 32.7614805,
            lng: 74.8481545
        },
        {
            id: 'peer-kho',
            name: 'Peer Kho flower-to-agarbatti initiative',
            category: 'partner',
            role: 'Potential flower-to-agarbatti initiative; project participation has not been confirmed.',
            lat: 32.734161,
            lng: 74.8761509
        },
        {
            id: 'gangyal',
            name: 'Gangyal Industrial Area, Jammu',
            category: 'site',
            role: 'Proposed processing-site location only; no approved plot, facility, or operation is represented.',
            lat: 32.6748865,
            lng: 74.8755663
        }
    ];

    const temples = [
        {
            id: 'raghunath',
            name: 'Raghunath (Ram) Temple',
            locationId: 'raghunath',
            footfall: { ordinary: 550, tuesday: 550, festival: 11000 },
            wastePerVisitorKg: 0.8 / 60,
            extraFestivalBins: 13,
            footfallBasis: 'Team workbook footfall (assumption back-solved from interviews). Tuesday is set equal to ordinary-day footfall in the workbook; festival footfall is a planning estimate.',
            wasteBasis: 'Team workbook estimate: 0.8 kg of flowers over 60 visitors.'
        },
        {
            id: 'shiv',
            name: 'Shiv Temple',
            locationId: 'shiv',
            footfall: { ordinary: 400, tuesday: 900, festival: 5000 },
            wastePerVisitorKg: 0.6 / 60,
            extraFestivalBins: 6,
            footfallBasis: 'Team workbook footfall estimate (assumption back-solved from interviews); festival footfall is a planning estimate.',
            wasteBasis: 'Team workbook estimate: 0.6 kg of flowers over 60 visitors.'
        },
        {
            id: 'bawe',
            name: 'Bawe Wali Mata Temple',
            locationId: 'bawe',
            footfall: { ordinary: 1000, tuesday: 2000, festival: 10000 },
            wastePerVisitorKg: 0.8 / 60,
            extraFestivalBins: 12,
            footfallBasis: 'Ordinary-day footfall is an assumption above the survey mean of 324 because the workbook describes this as Jammu’s presiding shrine with a heavy daily rush (Daily Excelsior). Tuesday uses the workbook’s 2x multiplier; its cited basis describes Bahu Fort Tuesday/Sunday special worship days (J&K Tourism and Maa Vaishno Devi Shrine Board site). Festival estimate: 10,000 pilgrims on the last Navratra day (Daily Excelsior, Oct 2020, described in the workbook as a low-key COVID year).',
            wasteBasis: 'Assumption: same waste per visitor as Raghunath Temple.'
        },
        {
            id: 'ranbireshwar',
            name: 'Ranbireshwar Temple',
            locationId: 'ranbireshwar',
            footfall: { ordinary: 324, tuesday: 469.8, festival: 1999 },
            wastePerVisitorKg: 3.355 / 324,
            extraFestivalBins: 2,
            footfallBasis: 'Ordinary-day footfall uses the Old City survey mean. Tuesday applies the survey Tuesday index. Festival footfall is derived from the workbook’s cited survey festival waste divided by waste per visitor; the source describes that survey midpoint as having an unclear basis.',
            wasteBasis: 'Survey-derived ordinary-day total of 3.355 kg divided by the survey mean of 324 visitors. The workbook identifies this as all waste types, using the midpoint of a 3.21–3.50 kg daily range.'
        }
    ];

    function getPermanentBins(temple) {
        const busiestRegularFootfall = Math.max(temple.footfall.ordinary, temple.footfall.tuesday);
        const ordinaryRequirement = getRequiredBins(temple, 'ordinary');
        const tuesdayRequirement = getRequiredBins(temple, 'tuesday');
        const visitorRuleBins = Math.ceil(busiestRegularFootfall / parameters.regularVisitorsPerPermanentBin);
        return Math.max(
            ordinaryRequirement,
            tuesdayRequirement,
            parameters.minimumPermanentBins,
            visitorRuleBins
        );
    }

    function getRequiredBins(temple, dayType) {
        const wasteKg = temple.footfall[dayType] * temple.wastePerVisitorKg;
        const accumulationKgPerHour = wasteKg / parameters.accumulationHours;
        return Math.max(1, Math.ceil(
            accumulationKgPerHour * parameters.modelledPickupGapHours / parameters.usableCapacityKg
        ));
    }

    function getPlan(templeId, dayType) {
        const temple = temples.find(item => item.id === templeId);
        if (!temple) throw new Error('Unknown temple planning record: ' + templeId);
        if (!Object.prototype.hasOwnProperty.call(temple.footfall, dayType)) {
            throw new Error('Unknown planning day type: ' + dayType);
        }

        const footfall = temple.footfall[dayType];
        const wasteKgPerDay = footfall * temple.wastePerVisitorKg;
        const accumulationKgPerHour = wasteKgPerDay / parameters.accumulationHours;
        const permanentBins = getPermanentBins(temple);
        const temporaryFestivalBins = dayType === 'festival' ? temple.extraFestivalBins : 0;
        const plannedBins = dayType === 'festival'
            ? Math.max(getRequiredBins(temple, dayType), permanentBins + temporaryFestivalBins)
            : permanentBins;

        return {
            temple,
            dayType,
            footfall,
            wasteKgPerDay,
            accumulationKgPerHour,
            hoursToFillOneBin: parameters.usableCapacityKg / accumulationKgPerHour,
            binsNeededPerPickup: getRequiredBins(temple, dayType),
            permanentBins,
            temporaryFestivalBins,
            plannedBins,
            hoursUntilAllBinsFull: plannedBins * parameters.usableCapacityKg / accumulationKgPerHour
        };
    }

    function getSummary(dayType) {
        const plans = temples.map(temple => getPlan(temple.id, dayType));
        const permanentBins = plans.reduce((total, plan) => total + plan.permanentBins, 0);
        const extraFestivalBins = temples.reduce((total, temple) => total + temple.extraFestivalBins, 0);
        return {
            plans,
            wasteKgPerDay: plans.reduce((total, plan) => total + plan.wasteKgPerDay, 0),
            permanentBins,
            extraFestivalBins,
            plannedBins: plans.reduce((total, plan) => total + plan.plannedBins, 0)
        };
    }

    window.FloralPlanning = {
        parameters,
        locations,
        temples,
        getPlan,
        getSummary
    };
})();
