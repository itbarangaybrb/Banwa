<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="32x32" href="../../img/browser-icon.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="../../img/browser-icon.svg">

    <title>Truck Entry</title>

    <link rel="stylesheet" href="../../styles/guard/truck_entry.css">
</head>

<body>
    <!-- 
        TODO: Front-end developer, will change
        this into modal once the designs is fully completed. 
      -->
    <p id="userStatus"></p>
    <button id="signoutBtn">Logout</button>

    <main>
        <section class="sections">
            <div class="containers">
                <div class="truck-entry-container">
                    <form action="" id="truckEntryForm">
                        <h3>Truck Entry</h3>

                        <div class="inputs">
                            <div class="label-and-input">
                                <label for="requestDate">Request Date</label>
                                <input type="date" name="requestDate" id="requestDate">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="dateOfWork">Date of Work</label>
                                <input type="date" name="dateOfWork" id="dateOfWork">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="nameOfHomeowner">Name of Homeowner</label>
                                <input type="text" name="nameOfHomeowner" id="nameOfHomeowner">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="nameOfHardware">Name of Hardware</label>
                                <input type="text" name="nameOfHardware" id="nameOfHardware">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="fullAdress">Full Address</label>
                                <input type="text" name="fullAdress" id="fullAdress">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="numbersOfTrucks">Number of Trucks</label>
                                <input type="text" name="numbersOfTrucks" id="numbersOfTrucks" pattern="[0-9]{1,2}" maxlength="2">
                                <div class="error-msg"></div>
                            </div>
                            <div class="label-and-input">
                                <label for="typeOfWheelerTruck">Type of Wheeler Truck</label>
                                <input type="text" name="typeOfWheelerTruck" id="typeOfWheelerTruck">
                                <div class="error-msg"></div>
                            </div>
                        </div>

                        <button type="submit" id="saveNewPass">Save</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <script src="../../scripts/guard/truck_entry.js"></script>
    <script type="module" src="../../scripts/auth/signout.js"></script>
</body>

</html>