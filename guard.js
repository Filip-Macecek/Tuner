

class Guard {
    static failIf(boolExpression, message)
    {
        if (boolExpression)
        {
            throw Error(message);
        }
    }
}