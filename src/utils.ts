export function formatDate(date: Date, time: boolean): string {
    return (
        date.toLocaleDateString("pt-BR") +
        (time
            ? " " +
              date.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "")
    );
}
