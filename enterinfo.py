import sqlite3 as sql

DBFILE = "details.db"


conn = sql.connect(DBFILE)
cursor = conn.cursor()

def createTables():
    cursor.execute("""
                CREATE TABLE IF NOT EXISTS subjectList (
                    subjectID          INTEGER PRIMARY KEY AUTOINCREMENT,
                    subject            TEXT NOT NULL
                )
            """)
    cursor.execute("""
                CREATE TABLE IF NOT EXISTS resources (
                    resourceID          INTEGER PRIMARY KEY AUTOINCREMENT,
                    subjectFID          INTEGER NOT NULL,
                    resourceText        TEXT NOT NULL,
                    FOREIGN KEY(subjectFID) REFERENCES subjectList(subjectID)
                )
            """)
    cursor.execute("""
                CREATE TABLE IF NOT EXISTS careers (
                    careersID          INTEGER PRIMARY KEY AUTOINCREMENT,
                    subjectFID         INTEGER NOT NULL,
                    careersText        TEXT NOT NULL,
                    careersName        TEXT NOT NULL,
                    FOREIGN KEY(subjectFID) REFERENCES subjectList(subjectID)
                )
            """)
    enterInfo()
#cursor.execute("""
#                DELETE FROM careers
#                WHERE careersID = 1;
#        """)

#cursor.execute("""
#               ALTER TABLE careers
#               ADD careersName TEXT NOT NULL;
#               """)
conn.commit()

def enterInfo():
    print("What would you like to do? \n\
          1. Enter new course\n\
          2. Enter resources for course\n\
          3. Enter new career for course\n\
          4. Delete all data\n\
          5. quit\n")
    choice = int(input("Enter number: "))

    if choice == 1:
        courseName = input("\n Enter course name: ")
        enterCourse(courseName)
        enterInfo()

    elif choice == 2:
        cursor.execute("""
                    SELECT * FROM subjectList
                   """)
        rows = cursor.fetchall()
        print(rows)
        subjectID_input = int(input("\n Which subject ID?: "))
        resourceText = input("Enter resource text\n\
                             : ")
        enterResources(subjectID_input, resourceText)
        enterInfo()

    elif choice == 3:
        cursor.execute("""
                    SELECT * FROM subjectList
                   """)
        rows = cursor.fetchall()
        print(rows)
        subjectID_input = int(input("\n Which subject ID?: "))
        careerName = input("\n Enter career name: ")
        careerText = input("\n Enter career text: ")
        enterCareers(subjectID_input, careerText, careerName)
        enterInfo()

    elif choice == 4:
        removeAllData()
        createTables()
        enterInfo()

    elif choice == 5:
        print("Exiting")
        conn.close()
        quit



def enterCourse(name):
    cursor.execute("""
                    INSERT INTO subjectList (subject)
                    VALUES (?);
                   """,
                   (name,))
    conn.commit()
    cursor.execute("""
                    SELECT * FROM subjectList
                   """)
    rows = cursor.fetchall()
    print(rows)

def enterResources(sID, rText):
    cursor.execute("""
                    INSERT INTO resources (subjectFID,resourceText)
                    VALUES (?,?);
                   """,
                   (sID,rText,))
    conn.commit()
    cursor.execute("""
                    SELECT * FROM resources
                   """)
    rows = cursor.fetchall()
    print(rows)

def enterCareers(sID, cText, cName):
    cursor.execute("""
                    INSERT INTO careers (subjectFID,careersText,careersName)
                    VALUES (?,?,?);
                   """,
                   (sID,cText,cName,))
    conn.commit()
    cursor.execute("""
                    SELECT * FROM careers
                   """)
    rows = cursor.fetchall()
    print(rows)

def removeAllData():
    cursor.execute("""
                DROP TABLE subjectList;
            """)
    cursor.execute("""
                DROP TABLE careers;
            """)
    cursor.execute("""
                DROP TABLE resources;
            """)
    conn.commit()


createTables()
enterInfo()

quit